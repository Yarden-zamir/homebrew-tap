# typed: false
# frozen_string_literal: true

class GhSource < Formula
  desc "Plugin manager for people who don't like plugin managers"
  homepage "https://github.com/Yarden-zamir/gh-source"
  url "https://github.com/Yarden-zamir/gh-source/archive/v0.0.23.tar.gz"
  sha256 "eb6174f6b8f398ddcc596438355c271cd545c56e56fef0c98b5156c7b1d89b33"
  license "MIT"

  depends_on "gh"

  def install
    pkgshare.install "gh-source.zsh"
    pkgshare.install "zsh-completion"
  end

  def caveats
    <<~EOS
      To activate gh-source, add the following at the end of your .zshrc:
        source #{opt_pkgshare}/gh-source.zsh
    EOS
  end
end
