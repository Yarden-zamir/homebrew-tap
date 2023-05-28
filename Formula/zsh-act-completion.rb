# typed: false
# frozen_string_literal: true

class ZshActCompletion < Formula
  desc "Zsh completions for act (for github)"
  homepage "https://github.com/Yarden-zamir/zsh-act-completion"
  url "https://github.com/Yarden-zamir/zsh-act-completion/archive/v0.0.31.tar.gz"
  sha256 "8b6253acf263cebbf6d019507d3408924e0f5dd5cf041eff6934d6ec751c75da"
  license "MIT"

  def install
    zsh_completion.install "zsh/_act" => "_act"
  end
end
