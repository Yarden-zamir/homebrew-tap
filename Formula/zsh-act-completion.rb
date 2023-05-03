# typed: false
# frozen_string_literal: true

class ZshActCompletion < Formula
  desc "Zsh completions for act (for github)"
  homepage "https://github.com/Yarden-zamir/zsh-act-completion"
  url "https://github.com/Yarden-zamir/zsh-act-completion/archive/v0.0.23.tar.gz"
  sha256 "629976f9bb725c0946c7c5d76312bd21a468d6be111ce671695aa70858376c97"
  license "MIT"

  def install
    zsh_completion.install "zsh/_act" => "_act"
  end
end
